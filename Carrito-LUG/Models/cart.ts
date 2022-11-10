import {Schema, model, SchemaTypes, Types} from "mongoose"

const cartSchema = new Schema({
    cartName: {type: String, unique: true},
    cartDetails: {type: Array},
    totalPrice: {type: Number, default: 0}
});

export default model("Cart", cartSchema);
