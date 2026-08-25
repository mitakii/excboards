using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Application.Interfaces;
using Application.Storage;
using Infrastructure.Storage.Dto;
using Microsoft.Extensions.Options;
using Minio;

namespace Infrastructure.Storage;

public class MinioStorage
{
    private readonly AmazonS3Client _client;
    private readonly string _bucketName;
    private readonly string _scheme;

    public MinioStorage(IOptions<MinioOptions> options)
    {
        var settings = options.Value;
        var config = new AmazonS3Config
        {
            ServiceURL = settings.ServiceURL, // e.g. http://localhost:9000
            ForcePathStyle = true // Required for MinIO
        };

        var credentials = new BasicAWSCredentials(settings.AccessKey, settings.SecretKey);
        _client = new AmazonS3Client(credentials, config);
        _bucketName = settings.BucketName;
        _scheme = new Uri(settings.ServiceURL).Scheme;
    }
    
    private string WithConfiguredScheme(string presignedUrl) =>
        new UriBuilder(presignedUrl) { Scheme = _scheme }.Uri.ToString();

    private async Task EnsureBucketExistsAsync()
    {
        var exists = await BucketExistsAsync(_bucketName);
        if (!exists)
        {
            await _client.PutBucketAsync(new PutBucketRequest { BucketName = _bucketName });
        }
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
            InputStream = fileStream
        };

        await _client.PutObjectAsync(request);
    }

    public async Task<Stream> GetFileAsync(string key)
    {
        var response = await _client.GetObjectAsync(_bucketName, key);
        return response.ResponseStream;
    }

    public async Task<string> GetPresignedUploadUrlAsync(string key, TimeSpan expiry)
    {
        await EnsureBucketExistsAsync();

        var url = await _client.GetPreSignedURLAsync(new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = key,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.Add(expiry)
        });
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
            result.AddRange(response.S3Objects.Select(o =>new StorageObjectInfo(o.Key, o.LastModified!.Value)));
            request.ContinuationToken = response.NextContinuationToken;
        } while (!string.IsNullOrEmpty(request.ContinuationToken));
        
        return result;
    }
}