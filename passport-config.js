const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

function initialize(passport, getUserByUsernameOrEmail, getUserById) {
    const authenticateUser = async (usernameOrEmail, password, done) => {
        const user = await getUserByUsernameOrEmail(usernameOrEmail);
        if (!user) {
            return done(null, false, { message: 'No user with that username or email' });
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect' });
            }
        } catch (e) {
            return done(e);
        }
    };

    passport.use(new LocalStrategy({ usernameField: 'usernameOrEmail' }, authenticateUser));
    passport.serializeUser((user, done) => done(null, user._id));
    passport.deserializeUser(async (id, done) => {
        return done(null, await getUserById(id));
    });
}

module.exports = initialize;
