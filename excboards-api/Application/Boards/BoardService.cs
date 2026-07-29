using Domain.Entities;
using Domain.Interfaces;

namespace Application.Boards;

public class BoardService(IBoardRepository boardRepository)
{
    public async Task<Guid> CreateBoardAsync(Guid userId, string name, string description)
    {
        var now = DateTime.UtcNow;

        var board = new UserBoard
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = name,
            Description = description,
            IsPublished = false,
            Created = now,
            Updated = now,
        };

        await boardRepository.AddAsync(board);

        return board.Id;
    }
}
