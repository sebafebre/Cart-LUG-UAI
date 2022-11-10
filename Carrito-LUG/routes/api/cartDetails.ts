import { Router } from "express";
import cartDetailsController from "../../Controllers/cartDetails";
//Invocamos la ruta de express
const router = Router();

//GET
router.get("/productsInCart", cartDetailsController.productsInCart)

router.get("/allCarts", cartDetailsController.allCarts);

//POST
router.post("/addProduct", cartDetailsController.addProduct)

//DELETE
router.delete("/deleteByName", cartDetailsController.deleteByName)

//PUT
router.put("/changeAmount", cartDetailsController.changeAmount)

router.put("/moreProduct", cartDetailsController.moreProduct)

router.put("/lessProduct", cartDetailsController.lessProduct)


export default router;

/*import { Router } from "express";
import carritoController from "../../Controllers/Carrito-Detalles";

//Invocamos la ruta de express
const router = Router();

//GET
router.get("/", carritoController.get)

//POST
router.post("/", carritoController.add)

//DELETE
router.delete("/:Nombre_Producto", carritoController.delete)

//PUT
router.put("/", carritoController.put)

export default router;*/