namespace Application.Dto;

public class UserDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public string ProfilePictureUrl { get; set; }
}
