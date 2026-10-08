namespace Application.Storage;

// Any S3-compatible backend: Cloudflare R2 in production, MinIO/RustFS etc. locally.
public class S3Options
{
    public string ServiceURL { get; set; }
    public string AccessKey { get; set; }
    public string SecretKey { get; set; }
    public string BucketName { get; set; }

    // R2 expects "auto"; MinIO and most self-hosted backends accept the default.
    public string Region { get; set; } = "us-east-1";

    // Dev convenience only. Production buckets are provisioned up front, and bucket-scoped
    // R2 tokens aren't allowed to check/create buckets anyway.
    public bool AutoCreateBucket { get; set; }
}
