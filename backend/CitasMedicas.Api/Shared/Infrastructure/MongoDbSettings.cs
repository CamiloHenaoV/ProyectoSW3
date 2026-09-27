namespace Piedrazul.Api.Shared.Infrastructure;

// Options Pattern: la configuración de Mongo se inyecta vía IOptions<MongoDbSettings>
public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
}
