using MongoDB.Bson;
using MongoDB.Driver;

namespace CitasMedicas.Api.Shared.Infrastructure;

public abstract class MongoRepository<T> : IRepository<T> where T : class
{
    protected readonly IMongoCollection<T> Collection;

    protected MongoRepository(IMongoContext context, string collectionName)
    {
        Collection = context.GetCollection<T>(collectionName);
    }

    public async Task<List<T>> GetAllAsync(FilterDefinition<T>? filter = null)
        => await Collection.Find(filter ?? FilterDefinition<T>.Empty).ToListAsync();

    public async Task<T?> GetByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id) || !ObjectId.TryParse(id, out var objectId))
            return null;

        return await Collection.Find(Builders<T>.Filter.Eq("_id", objectId)).FirstOrDefaultAsync();
    }

    public async Task<T?> FindOneAsync(FilterDefinition<T> filter)
        => await Collection.Find(filter).FirstOrDefaultAsync();

    public async Task CreateAsync(T entity) => await Collection.InsertOneAsync(entity);

    public async Task<bool> UpdateAsync(string id, T entity)
    {
        if (string.IsNullOrWhiteSpace(id) || !ObjectId.TryParse(id, out var objectId))
            return false;

        var result = await Collection.ReplaceOneAsync(Builders<T>.Filter.Eq("_id", objectId), entity);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id) || !ObjectId.TryParse(id, out var objectId))
            return false;

        var result = await Collection.DeleteOneAsync(Builders<T>.Filter.Eq("_id", objectId));
        return result.DeletedCount > 0;
    }
}