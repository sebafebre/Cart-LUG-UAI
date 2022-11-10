import { Router } from "express";
import productsController from "../../Controllers/products";

const router = Router();

//GET
router.get("/allProducts", productsController.allProducts)

router.get('/:productName', productsController.productByName)

//POST
router.post("/newProduct", productsController.newProduct)

//DELETE
router.delete("/deleteByName", productsController.deleteByName)

export default router;