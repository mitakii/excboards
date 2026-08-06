using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Application.Interfaces;
using Application.Storage;
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

    // The SDK's presign signer always emits "https" regardless of ServiceURL's scheme or
    // AmazonS3Config.UseHttp (verified against AWSSDK.S3 4.0.101.6 — neither affects it).
    // Rewriting the scheme afterwards is safe: SigV4 signs the Host header, not the URL scheme,
    // so the signature stays valid.
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
}