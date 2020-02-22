const functions = require('firebase-functions');
const admin = require("firebase-admin");
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://krantz-dev.firebaseio.com"
});

// Setup basic app
const cors = require("cors");
const express = require("express");
const app = express();
app.use(cors({origin: true}));

// Handle authentication of the API
let authentication = (req, res, next) => {
    if (req.get("Authorization") === undefined) {
        res.status(401).json({"status": "error", "reason": "header 'Authorization' must be present"});
        return;
    }

    admin.auth().verifyIdToken(req.get("Authorization")).then(token => {
        admin.firestore().collection("users").doc(token.uid).get().then(doc => {
            if (!doc.exists) {
                res.status(401).json({"status": "error", "reason": "corresponding user not found"});
                return;
            } else if (doc.data().role !== "admin") {
                res.status(403).json({"status": "error", "reason": "user must be an admin"});
                return;
            }

            next();
        }).catch(() => res.status(401).json({"status": "error", "reason": "invalid authorization token"}));
    }).catch(() => res.status(401).json({"status": "error", "reason": "invalid authorization token"}));
}

/*
Begin CRUD API definition
*/
const api = express.Router();
api.use(authentication);

// Create
api.post("/", (req, res) => {
    if (!req.body.hasOwnProperty("name") || !req.body.hasOwnProperty("link")) {
        res.status(400).json({"status": "error", "reason": "body must contain fields 'name' and 'link'"});
        return;
    }
    
    admin.firestore().collection("go").doc(req.body.name).get().then(doc => {
        if (doc.exists) {
            res.status(400).json({"status": "error", "reason": "shortlink already exists"});
            return;
        }

        admin.firestore().collection("go").doc(req.body.name).set({"link": req.body.link})
            .then(() => res.status(200).json({"status": "success"}))
            .catch(err => res.status(500).json({"status": "error", "reason": err.toString()}));
    }).catch(err => res.status(500).json({"status": "error", "reason": err.toString()}));
});

// List
api.get("/", (_, res) => admin.firestore().collection("go").get().then(snapshot => {
    var links = {};
    snapshot.forEach(doc => links[doc.id] = doc.data());
    res.status(200).json({"status": "success", "links": links});
}).catch(err => res.status(500).json({"status": "error", "reason": err.toString()})));

// Get
api.get("/:name", (req, res) => admin.firestore().collection("go").doc(req.params.name).get().then(doc => {
    if (!doc.exists) res.status(400).json({"status": "error", "reason": "shortlink does not exist"});
    else res.status(200).json({"status": "success", "shortlink": {"name": doc.id, ...doc.data()}});
    return;
}).catch(err => res.status(500).json({"status": "error", "reason": err.toString()})));

// Update
api.put("/:name", (req, res) => {
    if (!req.body.hasOwnProperty("link")) {
        res.status(400).json({"status": "error", "reason": "body must contain fields 'link'"});
        return;
    }

    admin.firestore().collection("go").doc(req.params.name).get().then(doc => {
        if (!doc.exists) {
            res.status(400).json({"status": "error", "reason": "shortlink does not exist"});
            return;
        }

        admin.firestore().collection("go").doc(req.params.name).update({"link": req.body.link})
            .then(() => res.status(200).json({"status": "success"}))
            .catch(err => res.status(500).json({"status": "error", "reason": err.toString()}));
    }).catch(err => res.status(500).json({"status": "error", "reason": err.toString()}));
});

// Delete
api.delete("/:name", (req, res) => admin.firestore().collection("go").doc(req.params.name).get().then(doc => {
    if (!doc.exists) {
        res.status(400).json({"status": "error", "reason": "shortlink does not exist"});
        return;
    }

    admin.firestore().collection("go").doc(req.params.name).delete()
        .then(() => res.status(200).json({"status": "success"}))
        .catch(err => res.status(500).json({"status": "error", "reason": err.toString()}))
}).catch(err => res.status(500).json({"status": "error", "reason": err.toString()})));
/*
End CRUD API definition
*/

// Handle API
app.use("/api", api);

// Redirect shortlink
app.get("/:name", (req, res) => admin.firestore().collection("go").doc(req.params.name).get().then(doc => {
    if (!doc.exists) res.redirect(`/404.html?link=${req.params.name}`);
    else res.redirect(doc.data().link);
    return;
}).catch(err => res.status(500).json({"status": "error", "reason": err.toString()})));


exports.go = functions.https.onRequest(app);
