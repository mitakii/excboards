using Domain.Enums;

namespace Application.Dto;

public class BoardCollaboratorDto
{
    public Guid BoardId { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string ProfilePictureUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public PermissionLevel Permission { get; set; }
}