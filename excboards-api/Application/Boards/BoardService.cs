using Domain.Entities;
using Domain.Interfaces;
using ErrorOr;

namespace Application.Boards;

public class BoardService(IBoardRepository boardRepository)
{
    public async Task<ErrorOr<Guid>> CreateAsync(Guid userId, string name, string description)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Error.Validation("Board.Name.Empty", "Board name is required.");

        if (await boardRepository.ExistsByNameAsync(userId, name))
            return Error.Validation("Board.DuplicateName", "A board with this name already exists.");

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

    public async Task<ErrorOr<Deleted>> RemoveAsync(Guid userId, Guid boardId)
    {
        var board = await boardRepository.GetByIdAsync(userId, boardId);
        if (board == null)
            return Error.NotFound("Board.NotFound", "Board not found");
        
        await boardRepository.RemoveAsync(board);

        return Result.Deleted;
    }

    public async Task<ErrorOr<Updated>> AddTagsAsync(Guid userId, Guid boardId, List<Tag> tags)
    {
        var board = await boardRepository.GetByIdAsync(userId, boardId);
        
        if(board == null)
            return Error.NotFound("Board.NotFound", "Board not found");
        
        board.Tags = tags;
        board.Updated = DateTime.UtcNow;
        
        await boardRepository.UpdateAsync(board);
        return Result.Updated;
    }

    public async Task<ErrorOr<Updated>> RemoveTagsAsync(Guid userId, Guid boardId, List<Tag> tagsToRemove)
    {
        var board = await boardRepository.GetByIdAsync(userId, boardId);
        
        if(board == null)
            return Error.NotFound("Board.NotFound", "Board not found");

        board.Tags = board.Tags.Except(tagsToRemove).ToList();
        board.Updated = DateTime.UtcNow;
        
        await boardRepository.UpdateAsync(board);
        return Result.Updated;
    }
}
