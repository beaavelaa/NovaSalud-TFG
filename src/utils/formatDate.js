module.exports = function formatDate(fechaISO) {
    try {
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    } catch {
        return fechaISO;
    }
};
