using System.Text.Json;
using Application.Interfaces;
using excboards_api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace excboards_api.Hubs;

[Authorize]
public class CanvasHub(IPermissionService permissionService) : Hub
{
    public async Task JoinRoom(Guid boardId)
    {
        var userId = Context.User!.GetUserId();
        if (!await permissionService.CanViewAsync(userId, boardId))
            throw new HubException("Not authorized to join this board.");

        await Groups.AddToGroupAsync(Context.ConnectionId, boardId.ToString());
    }

    public async Task LeaveRoom(Guid boardId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, boardId.ToString());

    public async Task BroadcastElements(Guid boardId, List<JsonElement> elements)
    {
        var userId = Context.User!.GetUserId();
        if (!await permissionService.CanEditAsync(userId, boardId))
            throw new HubException("Not authorized to edit this board.");

        await Clients.OthersInGroup(boardId.ToString()).SendAsync("ElementsUpdated", elements);
    }
}
