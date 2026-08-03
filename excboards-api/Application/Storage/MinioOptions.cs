namespace Application.Storage;

public class MinioOptions
{
    public string ServiceURL { get; set; }
    public string AccessKey { get; set; }
    public string SecretKey { get; set; }
    public string BucketName { get; set; }
}