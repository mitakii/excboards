using System.Text.Json;
using Application.Interfaces;
using excboards_api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace excboards_api.Hubs;

public class CanvasHub(IPermissionService permissionService) : Hub
{
    private static readonly TimeSpan EditCheckTtl = TimeSpan.FromSeconds(5); 
    private record EditCheck(bool CanEdit, DateTime LastCheck);
    
    public async Task JoinRoom(Guid boardId)
    {
        if (!await permissionService.WorldBoardExistsAsync(boardId))
        {
            if (Context.User?.Identity?.IsAuthenticated != true
                || !await permissionService.CanViewAsync(Context.User.GetUserId(), boardId))
                throw new HubException("Not authorized to join this board.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, boardId.ToString());
    }

    public async Task LeaveRoom(Guid boardId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, boardId.ToString());

    [Authorize]
    public async Task BroadcastElements(Guid boardId, List<JsonElement> elements)
    {
        var userId = Context.User!.GetUserId();
        if (!await CanEditCachedAsync(userId, boardId))
            throw new HubException("Not authorized to edit this board.");

        await Clients.OthersInGroup(boardId.ToString()).SendAsync("ElementsUpdated", elements);
    }
    
    private async Task<bool> CanEditCachedAsync(Guid userId, Guid boardId)
    {
        var key = $"canEdit:{boardId}";
        var now = DateTime.UtcNow;
        
        if(Context.Items.TryGetValue(key, out var item) 
           && item is EditCheck check 
           && now - check.LastCheck < EditCheckTtl)
            return check.CanEdit;

        var canEdit = await permissionService.CanEditAsync(userId, boardId)
                      || await permissionService.CanEditWorldBoardAsync(userId, boardId);
        Context.Items[key] = new EditCheck(canEdit, now);
        return canEdit;
    }
}
