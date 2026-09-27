using MongoDB.Bson.Serialization.Conventions;

namespace CitasMedicas.Api.Shared.Infrastructure;

public static class MongoConventions
{
    public static void Registrar()
    {
        var pack = new ConventionPack
        {
            new CamelCaseElementNameConvention() // C# PascalCase -> Mongo camelCase
        };
        ConventionRegistry.Register("camelCase", pack, _ => true);
    }
}