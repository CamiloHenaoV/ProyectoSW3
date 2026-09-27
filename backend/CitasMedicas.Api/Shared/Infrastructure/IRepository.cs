using MongoDB.Driver;

namespace CitasMedicas.Api.Shared.Infrastructure;

public interface IRepository<T> where T : class
{
    Task<List<T>> GetAllAsync(FilterDefinition<T>? filter = null);
    Task<T?> GetByIdAsync(string id);
    Task<T?> FindOneAsync(FilterDefinition<T> filter);
    Task CreateAsync(T entity);
    Task<bool> UpdateAsync(string id, T entity);
    Task<bool> DeleteAsync(string id);
}