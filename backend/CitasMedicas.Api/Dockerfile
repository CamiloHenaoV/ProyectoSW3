FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["CitasMedicas.Api.csproj", "./"]
RUN dotnet restore "CitasMedicas.Api.csproj"
COPY . .
RUN dotnet publish "CitasMedicas.Api.csproj" --configuration Release --no-restore --output /app/publish /p:UseAppHost=false

FROM runtime AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["sh", "-c", "dotnet CitasMedicas.Api.dll --urls http://0.0.0.0:${PORT:-8080}"]
