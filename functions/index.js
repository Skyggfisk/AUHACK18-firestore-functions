"use strict";
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

exports.sendOnWrite = functions.firestore
  .document("/teams/{teamid}/shoppingList/{itemid}")
  .onCreate((change, context) => {
    const teamid = context.params.teamid;
    const itemid = context.params.itemid;

    let docRef = db.doc(`/teams/${teamid}/shoppingList/${itemid}`);
    return docRef.get().then(documentSnapshot => {
      let data = documentSnapshot.data();
      data.id = itemid;
      onCreateSuccess(teamid, itemid, data);
      return "dawda";
    });
  });

exports.sendNotification = functions.firestore
  .document("/teams/{teamid}/shoppingList/{itemid}")
  .onDelete((change, context) => {
    console.log("something happened");
    const teamid = context.params.teamid;
    const itemid = context.params.itemid;

    const userQuery = admin.database().ref(`/users`);
    return Promise.all([
      db
        .collection("users")
        .where(`teams.${teamid}`, "==", true)
        .get()
        .then(
          querySnapshot => {
            let tokens = [];
            let docs = querySnapshot.docs;
            console.log("successful");
            for (let doc of docs) {
              let data = doc.data();
              console.log("Token:" + data.fcm_Token);
              console.log(`Document found at path : ${doc.ref.path}`);
              tokens.push(data.fcm_Token);
            }
            return onSuccess(tokens);
          },
          onfail => {
            return "fail";
          }
        )
    ]);
  });

function onSuccess(tokens) {
  const payload = {
    notification: {
      title: "Shopping List Updated",
      body: "An item has been bought."
    }
  };
  return admin.messaging().sendToDevice(tokens, payload);
}

function onCreateSuccess(teamid, itemid, data) {
  db.doc(`/teams/${teamid}/shoppingList/${itemid}`).set(data);
}
