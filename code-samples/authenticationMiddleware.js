// Portfolio Sample - Role-Based Authentication Middleware

const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        const user = req.session?.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions"
            });
        }

        next();
    };
};

const sessionChecker = (req, res, next) => {
    if (!req.session?.user) {
        return res.status(401).json({
            success: false,
            message: "Session expired"
        });
    }

    next();
};

module.exports = { authorize, sessionChecker };
