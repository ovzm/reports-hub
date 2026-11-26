// import passport from "passport";
// import session from "express-session";
// import MicrosoftStrategy from "passport-microsoft";
// import { findUser, publicUser } from "./users.js";
// import { signToken } from "./auth.js";
//
// export function setupMicrosoftLogin(app) {
//   app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: false }));
//   app.use(passport.initialize());
//   app.use(passport.session());
//
//   passport.use(
//     new MicrosoftStrategy.Strategy(
//       {
//         clientID: process.env.CLIENT_ID,
//         clientSecret: process.env.CLIENT_SECRET,
//         callbackURL: process.env.REDIRECT_URI,
//         authorizationURL: `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/authorize`,
//         tokenURL: `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
//         scope: ["user.read"]
//       },
//       (accessToken, refreshToken, profile, done) => done(null, profile)
//     )
//   );
//
//   passport.serializeUser((user, done) => done(null, user));
//   passport.deserializeUser((obj, done) => done(null, obj));
//
//   app.get("/auth/microsoft", passport.authenticate("microsoft", { prompt: "select_account" }));
//
//   app.get(
//     "/auth/microsoft/callback",
//     passport.authenticate("microsoft", { failureRedirect: "/" }),
//     (req, res) => {
//       const email = req.user.emails[0].value.toLowerCase();
//       const user = findUser(email);
//       if (!user) return res.redirect("/index.html?erro=sem-permissao");
//       res.redirect(`/page/home.html?token=${signToken(user)}`);
//     }
//   );
// }
