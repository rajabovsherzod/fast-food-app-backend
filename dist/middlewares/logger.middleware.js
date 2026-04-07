export const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const emoji = res.statusCode >= 500 ? "💥" : res.statusCode >= 400 ? "⚠️" : "✅";
        console.log(`${emoji} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
};
