using CitasMedicas.Api.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace CitasMedicas.Api.Tests;

public class AuthorizationPolicyTests
{
    [Fact]
    public void AddAuthorization_registersPacientePolicy()
    {
        var services = new ServiceCollection();

        services.AddAuthorization(options =>
        {
            options.AddPolicy(Roles.Paciente, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireClaim(System.Security.Claims.ClaimTypes.Role, Roles.Paciente);
            });
        });

        using var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<AuthorizationOptions>>().Value;

        Assert.True(options.GetPolicy(Roles.Paciente) is not null);
    }
}
