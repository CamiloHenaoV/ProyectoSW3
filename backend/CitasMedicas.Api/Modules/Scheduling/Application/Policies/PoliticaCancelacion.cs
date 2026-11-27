namespace CitasMedicas.Api.Modules.Scheduling.Application.Policies;

public static class PoliticaCancelacion
{
    public static readonly TimeSpan AnticipacionMinima = TimeSpan.FromHours(48);

    public static readonly TimeSpan DesfaseColombia = TimeSpan.FromHours(-5);

    public const int LongitudMaximaMotivo = 500;

    public const string MensajeMotivoRequerido = "Debes indicar la justificación de la cancelación.";

    public const string MensajeAnticipacion =
        "Solo puedes cancelar una cita con al menos 2 días de anticipación.";

    public static string MensajeMotivoMuyLargo =>
        $"La justificación no puede superar {LongitudMaximaMotivo} caracteres.";

    public static DateTime InicioLocal(DateTime fecha, TimeSpan horaInicio)
        => DateTime.SpecifyKind(fecha.Date, DateTimeKind.Unspecified) + horaInicio;

    public static DateTime AhoraLocal(DateTimeOffset ahora)
        => ahora.ToOffset(DesfaseColombia).DateTime;

    public static bool CumpleAnticipacion(DateTime fecha, TimeSpan horaInicio, DateTimeOffset ahora)
        => InicioLocal(fecha, horaInicio) - AhoraLocal(ahora) >= AnticipacionMinima;
}
