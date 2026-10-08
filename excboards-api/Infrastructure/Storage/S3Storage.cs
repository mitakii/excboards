using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Application.Dto;
using Application.Interfaces;
using Application.Storage;
using Microsoft.Extensions.Options;

namespace Infrastructure.Storage;

public class S3Storage
{
    private readonly AmazonS3Client _client;
    private readonly string _bucketName;
    private readonly string _scheme;
    private readonly bool _autoCreateBucket;
    private volatile bool _bucketEnsured;

    public S3Storage(IOptions<S3Options> options)
    {
        var settings = options.Value;
        var config = new AmazonS3Config
        {
            ServiceURL = settings.ServiceURL, // e.g. http://localhost:9000 or https://<account>.r2.cloudflarestorage.com
            AuthenticationRegion = settings.Region,
            ForcePathStyle = true,
            // SDK v4 adds CRC checksums to every request by default; non-AWS backends (R2, MinIO)
            // don't all handle that, so only send them where the S3 API requires it.
            RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
            ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED
        };

        var credentials = new BasicAWSCredentials(settings.AccessKey, settings.SecretKey);
        _client = new AmazonS3Client(credentials, config);
        _bucketName = settings.BucketName;
        _scheme = new Uri(settings.ServiceURL).Scheme;
        _autoCreateBucket = settings.AutoCreateBucket;
    }

    private string WithConfiguredScheme(string presignedUrl) =>
        new UriBuilder(presignedUrl) { Scheme = _scheme }.Uri.ToString();

    private async Task EnsureBucketExistsAsync()
    {
        if (!_autoCreateBucket || _bucketEnsured) return;

        var exists = await BucketExistsAsync(_bucketName);
        if (!exists)
        {
            await _client.PutBucketAsync(new PutBucketRequest { BucketName = _bucketName });
        }
        _bucketEnsured = true;
    }

    private async Task<bool> BucketExistsAsync(string bucketName)
    {
        try
        {
            var response = await _client.GetBucketLocationAsync(bucketName);
            return true;
        }
        catch (AmazonS3Exception ex)
        {
            if (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                return false;
            throw;
        }
    }

    public async Task UploadFileAsync(string key, Stream fileStream)
    {
        await EnsureBucketExistsAsync();

        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            InputStream = fileStream,
            // R2 doesn't support streaming SigV4 (aws-chunked) uploads. Unsigned payloads are
            // only allowed over HTTPS, so local plain-HTTP backends keep the signed path.
            DisablePayloadSigning = _scheme == Uri.UriSchemeHttps
        };

        await _client.PutObjectAsync(request);
    }

    public async Task<Stream> GetFileAsync(string key)
    {
        var response = await _client.GetObjectAsync(_bucketName, key);
        return response.ResponseStream;
    }

    public async Task<string> GetPresignedUploadUrlAsync(string key, TimeSpan expiry, string contentType, long contentLength)
    {
        await EnsureBucketExistsAsync();

        // Content-Type and Content-Length become SigV4 signed headers, so storage rejects
        // (403) a PUT whose body size or type differs from what the API validated.
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = key,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.Add(expiry),
            ContentType = contentType
        };
        request.Headers.ContentLength = contentLength;

        var url = await _client.GetPreSignedURLAsync(request);
        return WithConfiguredScheme(url);
    }

    public async Task<string> GetPresignedDownloadUrlAsync(string key, TimeSpan expiry)
    {
        var url = await _client.GetPreSignedURLAsync(new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = key,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.Add(expiry)
        });
        return WithConfiguredScheme(url);
    }

    public async Task<bool> DeleteFileAsync(string key)
    {
        var response = await _client.DeleteObjectAsync(_bucketName, key);
        return response.HttpStatusCode is System.Net.HttpStatusCode.OK or System.Net.HttpStatusCode.NoContent;
    }
    
    public async Task<bool> DeleteFilesAsync(IEnumerable<string> keys)
    {
        var allSucceeded = true;
        foreach (var chunk in keys.Chunk(1000))
        {
            var request = new DeleteObjectsRequest()
            {
                BucketName = _bucketName,
                Objects = chunk.Select(k => new KeyVersion { Key = k }).ToList()
            };
            var response = await _client.DeleteObjectsAsync(request);
            
            if(response.DeleteErrors is {Count: > 0}) allSucceeded = false;
        }
        return allSucceeded;
    }

    public async Task<IReadOnlyList<StorageObjectInfo>> ListObjectsAsync(string prefix)
    {
        var request = new ListObjectsV2Request
        {
            BucketName = _bucketName,
            MaxKeys = 100,
            Prefix = prefix
        };

        var result = new List<StorageObjectInfo>();

        do
        {
            var response = await _client.ListObjectsV2Async(request);
            if (response.S3Objects is not null)
            {
                result.AddRange(response.S3Objects.Select(o => new StorageObjectInfo(o.Key, o.LastModified!.Value, o.Size ?? 0)));
            }
            request.ContinuationToken = response.NextContinuationToken;
        } while (!string.IsNullOrEmpty(request.ContinuationToken));
        
        return result;
    }
}