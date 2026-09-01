using System.Text.Json;

namespace Infrastructure.Storage;

public static class SceneJsonFileParser
{
    public static async Task<HashSet<string>> GetReferencedFileIdsAsync(Stream stream)
    {
        var result = new HashSet<string>();
        var jsonDoc = await JsonDocument.ParseAsync(stream);
        
        if(!jsonDoc.RootElement
               .TryGetProperty("elements", out var elements)
           || elements.ValueKind != JsonValueKind.Array)
            return result;


        foreach (var element in elements.EnumerateArray())
        {
            if(element.TryGetProperty("isDeleted", out var isDeleted)
               && isDeleted.ValueKind == JsonValueKind.True)
                continue;
            
            if (!element.TryGetProperty("type", out var type) 
                || type.ValueKind != JsonValueKind.String 
                || type.GetString() != "image")
                continue;

            if (element.TryGetProperty("fileId", out var fileId)
                && fileId.ValueKind == JsonValueKind.String)
            {
                var id = fileId.GetString();
                if(!string.IsNullOrEmpty(id))
                    result.Add(id);
            }
        }

        return result;
    }
}