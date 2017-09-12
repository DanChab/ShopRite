const request = require('request');
var jf = require('./utils/jsonfile.js');

// Sending message to user
var sendMessage = (recipientId, message) => {
  request({
    url:"https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message:message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}

var checkProducts = (senderId) => {
    var elements = [];
       request("https://lumpus-backend.herokuapp.com/api/shoprite/prodCategory", (error, response, body) =>{
      if (!error && response.statusCode == 200) {
        let prodCtgArray = JSON.parse(body);
        console.log(prodCtgArray);
        // Looping through
        prodCtgArray.forEach(function(category){
          let idCtg = category._id;
          let nameCtg = category.cathegory;
          // Adding item to the elements array
          elements.push({  
              "content_type":"text",
              "title":nameCtg,
              "payload":"PRODUCT_CATEGORY-"+nameCtg
         });
        });
        console.log(elements);
        let messageData = {
          "text":"We have a variety of products...here are the categories  ",
         "quick_replies":
           elements     
     }
     sendMessage(senderId, messageData);
      }
    });
  }
var allProductCategory = (senderId, ctgName) => {
    var elements = [];
    var ctgName = ctgName.toLowerCase().trim();

    request(`https://lumpus-backend.herokuapp.com/api/shoprite/prodCategory/ctg_name=${ctgName}`, (error,response, body) => {
      
      if (!error && response.statusCode == 200){
        var itemsArray = JSON.parse(body);
        console.log(itemsArray);
  
        itemsArray.forEach((itemObj) => {
          let itemName  = itemObj.name;
          let itemPrice = itemObj.price;
          let itemImg   = itemObj.image;
          let itemId    = itemObj._id;
          let common_name = itemObj.common_name;
  
           // Adding item to the elements array
           elements.push({
            "title": itemName + " " +itemPrice,
            "subtitle":  common_name,
            "image_url": itemImg,
            "buttons": [{
              "type": "postback",
              "title": "Order",
              "payload": "ORDER-"+itemId
            },
            {
              "type": "postback",
              "title": "Add To Shopping List",
              "payload": "ADD_TO_LIST-"+itemId
            }]
          });
        });
  
        let messageData = {
          "attachment":{
            "type": "template",
            "payload": {
              "template_type": "generic",
              elements
      }
     }
    }
  sendMessage(senderId, messageData);
  
      }
      
    });
  };
var confirmAddToList = (senderId, itemId) => {
    // First get item's details 
    request(`https://lumpus-backend.herokuapp.com/api/shoprite/shoppingList/itemDetails=${itemId}`, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        let itemArray = JSON.parse(body);
        console.log(itemArray);
        itemArray.forEach((itemObj) => {
          var itemId = itemObj._id;
          var itemName = itemObj.name;
          var itemPrice = itemObj.price;
       
        // Create quick reply template
          let messageData = {
            "text":`Do you want to add ${itemName} cost:${itemPrice} ?`,
            "quick_replies":[
              {
                "content_type":"text",
                "title":'Yes',
                "payload":`YES_ADD_TO_LIST-${itemId}-${itemName}-${itemPrice}`
            },
            {
              "content_type":"text",
              "title":'No',
              "payload":"NO_ADD_TO_LIST-"+itemId
          }]     
        }
        sendMessage(senderId, messageData);
      });
     }else{
          sendMessage(senderId,{text:'😖😖Sorry try again later...'});
        };
      });
    };
      
var askQtyItem = (senderId, arg2, arg3, arg4) => {
  let messageData = {
    "text":`How many do you want?`,
    "quick_replies":[
      {
        "content_type":"text",
        "title":'Just one',
        "payload":`JUST_ONE_ITEM-${arg2}-${arg3}-${arg4}`
    },
    {
      "content_type":"text",
      "title":'Many',
      "payload":`MORE_ITEMS-${arg2}-${arg3}-${arg4}`
  }]     
  }
  sendMessage(senderId, messageData);
  };

var addToList = (senderId, itemId, itemName, itemPrice, itemQty) => {
    request({
    url: "https://lumpus-backend.herokuapp.com/api/shoprite/shoppingList",
    method: "POST",
    body: {
          userId : senderId,
          itemId : itemId,
          itemName :  itemName,
          itemPrice  : itemPrice,
          itemQty  : itemQty
    },
    json:true

    }, function(error, response, body){
    if (error) throw error;
    if (!error && response.statusCode == 200){
        sendMessage(senderId, {text: `Added To Shopping List...😊`});

        //Delete the item form the json file
        jf.removeNote(senderId);
        checkProducts(senderId)
    }else {
      sendMessage (senderId, {text:"😖 Hoops, sorry i couldn't save this Pizza to your list!! Try again later..."})
    }

    });

    }
module.exports = {
    sendMessage,
    allProductCategory,
    checkProducts,
    confirmAddToList,
    askQtyItem,
    addToList
   
  }