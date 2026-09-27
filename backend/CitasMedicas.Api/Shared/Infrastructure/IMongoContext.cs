using MongoDB.Driver;

namespace CitasMedicas.Api.Shared.Infrastructure;

public interface IMongoContext
{
    IMongoCollection<T> GetCollection<T>(string collectionName);
}