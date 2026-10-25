# syntax=docker/dockerfile:1
# Build context must be excboards-api/ (run these from that directory):
#   docker build --target api -t excboards-api .
#   docker build --target workers -t excboards-workers .
#   docker build --target migrations -t excboards-migrations .
# Image tags are pinned to patch versions; bump them together (Renovate/Dependabot can do it).

# build
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0.403-noble AS build
ARG TARGETARCH
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY Domain/Domain.csproj                 Domain/
COPY Application/Application.csproj       Application/
COPY Infrastructure/Infrastructure.csproj Infrastructure/
COPY Api/Api.csproj                       Api/
COPY Workers/Workers.csproj               Workers/
RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages \
    dotnet restore Api/Api.csproj -a $TARGETARCH \
 && dotnet restore Workers/Workers.csproj -a $TARGETARCH

COPY . .

FROM build AS publish-api
RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages \
    dotnet publish Api/Api.csproj -c $BUILD_CONFIGURATION -a $TARGETARCH \
      -o /app/publish /p:UseAppHost=false

FROM build AS publish-workers
RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages \
    dotnet publish Workers/Workers.csproj -c $BUILD_CONFIGURATION -a $TARGETARCH \
      -o /app/publish /p:UseAppHost=false

FROM build AS publish-migrations
RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages \
    dotnet tool restore \
 && RID=$([ "$TARGETARCH" = "amd64" ] && echo linux-x64 || echo linux-$TARGETARCH) \
 && dotnet ef migrations bundle \
      --project Infrastructure/Infrastructure.csproj \
      --startup-project Workers/Workers.csproj \
      --configuration $BUILD_CONFIGURATION \
      --self-contained -r $RID \
      -o /app/efbundle

# api 
FROM mcr.microsoft.com/dotnet/aspnet:10.0.14-noble-chiseled-extra AS api
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=publish-api --chown=app:app /app/publish .
USER app
ENTRYPOINT ["dotnet", "Api.dll"]

# workers
FROM mcr.microsoft.com/dotnet/aspnet:10.0.14-noble-chiseled-extra AS workers
WORKDIR /app
COPY --from=publish-workers --chown=app:app /app/publish .
USER app
ENTRYPOINT ["dotnet", "Workers.dll"]

# migrations
# docker run --rm excboards-migrations --connection "connection string"
FROM mcr.microsoft.com/dotnet/runtime-deps:10.0.14-noble-chiseled-extra AS migrations
WORKDIR /app
COPY --from=publish-migrations --chown=app:app /app/efbundle .
USER app
ENTRYPOINT ["./efbundle"]
