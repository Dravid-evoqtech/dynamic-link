export const updateLastActive = async (req, res, next) => {
    try {
        if (req.user) {
            req.user.lastOpenedAppAt = new Date();
            await req.user.save();
        }
    } catch (err) {
        console.error("Activity update error:", err);
        throw new APIError(500, `Error updating activity: ${err}`);
    }
    next();
};
