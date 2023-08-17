const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://0.0.0.0:27017/todolistDB", {useNewUrlParser:true});

const ItemsSchema = new mongoose.Schema({
    name:String
});
const ItemsModel = mongoose.model("Item", ItemsSchema);

const Item1 = new ItemsModel({
    name:"Learn JavaScript"
});

const Item2 = new ItemsModel({
    name:"Learn React"
});

const Item3 = new ItemsModel({
    name:"Learn MongoDB"
});

const defaultItems = [Item1, Item2, Item3];

const listSchema = {
    name:String,
    items:[ItemsSchema]
};

const ListModel = mongoose.model("List", listSchema);

async function insertItems() {
    try {
        const result = await ItemsModel.insertMany(defaultItems);
        console.log("successfully inserted collections");
        console.log(result);
    } catch (error) {
        console.log(error);
    }
}
// insertItems();

//fetchItems in collections
async function fetchItems() {
    try {
        const itemList = await ItemsModel.find()

        console.log("items displayed successfully");
        itemList.forEach(function(item) {
            console.log(item.name);
        });

    } catch (error) {
        console.log(error);
    }
}
// fetchItems();

// ItemsModel.updateMany({}, { $rename: { "items": "name" } })
//   .then(result => {
//     console.log("Successfully updated documents");
//     console.log(result);
//   })
//   .catch(err => {
//     console.log(err);
//   });

app.get("/", async function (req, res) {

    const foundItems = await ItemsModel.find({});
    if(foundItems.length === 0) {
        try {
            const result = await ItemsModel.insertMany(defaultItems);
            console.log("successfully inserted collections");
            console.log(result);
        } catch (error) {
            console.log(error);
        }
        res.redirect("/");
    }else {
        res.render("list", {listTitle:"Today" ,newListItems: foundItems});
    }
});

app.post("/", async function(req,res) {
     const itemName = req.body.newItem;
     const listName = req.body.list;

     const item = new ItemsModel({
        name:itemName
     });
     if(listName == "Today") {
      await item.save();
        console.log(`successfully added ${itemName} in db`);
        res.redirect("/");
     }else {
        const foundList = await ListModel.findOne({name: listName});
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName);
     }
          
});

app.post("/delete", async function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    // console.log(checkedItemId);

    if(listName == "Today") {
        try {
            const result = await ItemsModel.findByIdAndRemove(checkedItemId);
            console.log("successfully deleted item from default list");
            // console.log(result);
        } catch (error) {
            console.log(error);
        }
        res.redirect("/"); 
    }else {
       try {
        const foundList = await ListModel.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
       } catch (error) {
        console.log(error);
       }
       res.redirect("/"+ listName);
    } 
});

app.get("/:customListName", async function(req, res){

    try {
        const customListName = _.capitalize(req.params.customListName);

        const result = await ListModel.findOne({name: customListName});
        // console.log(result);
            if(!result) {
                //create a new list
                const list = new ListModel({
                    name:customListName,
                    items:defaultItems
                });
                console.log(customListName);            
               await list.save();    
               res.redirect("/" + customListName);           
            }else{
               //render the existing list
               res.render("list", {listTitle:result.name, newListItems:result.items});
            }

    } catch (error) {
        console.log(error);
    }
});

// app.post("/work", function(req,res) {
//     let item = req.body.newItem
//     workItems.push(item)
//     res.redirect("/work ")
// })

app.get("/about", function(req, res) {
    res.render("about")
})

app.listen(3000, function () {
    console.log("server started on port 3000")
})