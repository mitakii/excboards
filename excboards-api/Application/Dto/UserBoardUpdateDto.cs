namespace Application.Dto;

public class UserBoardUpdateDto
{
    public string Name { get; set; }
    public string Description { get; set; }
    public List<string> Tags { get; set; }
}