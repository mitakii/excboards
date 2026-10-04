using System.Linq.Expressions;
using Domain.Dto;
using Domain.Entities;

namespace Infrastructure.Persistence.Projections;

public static class BoardProjections
{
    public static Expression<Func<UserBoard, BoardSummaryDto>> Summary(Guid? viewerId) =>
        viewerId is { } id ? ForViewer(id) : Anonymous;

    private static Expression<Func<UserBoard, BoardSummaryDto>> ForViewer(Guid viewerId) => b => new BoardSummaryDto
    {
        Id = b.Id,
        OwnerId = b.UserId,
        Name = b.Name,
        Description = b.Description,
        IsPublished = b.IsPublished,
        Created = b.Created,
        Updated = b.Updated,
        LikesCount = b.BoardLikes.Count,
        IsLiked = b.BoardLikes.Any(l => l.UserId == viewerId),
        IsBookmarked = b.BoardBookmarks.Any(bm => bm.UserId == viewerId),
        Tags = b.Tags.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList()
    };

    private static readonly Expression<Func<UserBoard, BoardSummaryDto>> Anonymous = b => new BoardSummaryDto
    {
        Id = b.Id,
        OwnerId = b.UserId,
        Name = b.Name,
        Description = b.Description,
        IsPublished = b.IsPublished,
        Created = b.Created,
        Updated = b.Updated,
        LikesCount = b.BoardLikes.Count,
        IsLiked = null,
        IsBookmarked = null,
        Tags = b.Tags.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList()
    };
}
