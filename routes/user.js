var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelper = require('../helpers/user-helpers')
const verifyLogin = (req, res, next) => {
  if (req.session.userloggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */


router.get('/', async function (req, res, next) {
  let user = req.session.user
  console.log(user);
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products) => {

    res.render('user/view-products', { products, user, cartCount })
  })
});





router.get('/login', (req, res) => {
  console.log(req.session.user);
  if (req.session.user) {

    res.redirect('/')
  } else {
    res.render('user/login', { "loginErr": req.session.userloginErr })
    req.session.userloginErr = false
  }
})

router.get('/signup', (req, res) => {
  res.render('user/signup')
})


router.post('/signup', (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    console.log(response);

    req.session.user = response
    req.session.user.loggedIn = true
    res.redirect('/')
  })
})

router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {

      req.session.userloginErr = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.userloginErr = "Invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
})

router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelper.getCartProducts(req.session.user._id)
  let totalValue = 0
  if (products.length > 0) {
    totalValue = await userHelper.getTotalAmount(req.session.user._id)
  }
  console.log(products);
  console.log('***' + req.session.user_id);
  res.render('user/cart', { products, user: req.session.user._id, totalValue })
})


router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  console.log("api call");
  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })

})

router.post('/change-product-quantity', (req, res, next) => {
  console.log(req.body);
  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.getTotalAmount(req.body.user)
    res.json(response)

  })
})

router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelper.getTotalAmount(req.session.user_id)
  res.render('user/place-order', { total, user: req.session.user })
})

router.post('/place-order', async (req, res) => {
  console.log(req.body);
  let products = await userHelper.getCartProductList(req.body.userId)
  let totalPrice = await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body, products, totalPrice).then((orderId) => {
    console.log(orderId);
    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })

    } else {
      userHelper.generateRazorpay(orderId, totalPrice).then((respons) => {
        res.json(response)

      })
    }
  })
  console.log(req.body);
})

router.get('/order-success', (req, res) => {
  res.render('user/order-success', { user: req.session.user })
})

router.get('/orders', async (req, res) => {
  let orders = await userHelper.getOrderProducts(req.params.id)
  res.render('user/orders', { user: req.session, user, orders })
})

router.get('/view-order-products/:id', async (req, res) => {
  let products = await userHelper.getOrderProducts(req.params.id)
  res.render('user/view-order-products', { user: req.session.user, products })
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(() => {
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("Payment successful");
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: '' })
  })
})



module.exports = router;
