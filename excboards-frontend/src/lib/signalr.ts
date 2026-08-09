import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

export function createCanvasHubConnection() {
  return new HubConnectionBuilder()
    .withUrl(`${import.meta.env.VITE_API_BASE_URL}/hubs/canvas`, {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}
