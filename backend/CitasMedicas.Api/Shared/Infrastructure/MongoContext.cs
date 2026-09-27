using MongoDB.Driver;

namespace CitasMedicas.Api.Shared.Infrastructure;

public class MongoContext : IMongoContext
{
    private readonly IMongoDatabase _database;

    public MongoContext(IMongoDatabase database)
    {
        _database = database;
    }

    public IMongoCollection<T> GetCollection<T>(string collectionName)
        => _database.GetCollection<T>(collectionName);
}