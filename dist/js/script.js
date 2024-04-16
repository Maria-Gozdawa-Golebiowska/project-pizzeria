/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', 
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', 
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, 

    cart: {
      defaultDeliveryFee: 20,
    },
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.dom = {};

      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    renderInMenu() {
      const thisProduct = this;
      const generatedHTML = templates.menuProduct(thisProduct.data);
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      const menuContainer = document.querySelector(select.containerOf.menu);
      menuContainer.appendChild(thisProduct.element);

      
    }

    initAccordion() {
      const thisProduct = this;
      const clickableTrigger = thisProduct.element.querySelector('.product__header');
      clickableTrigger.addEventListener('click', function (event) {
        event.preventDefault();
        const activeProducts = document.querySelectorAll('.product.active');
        activeProducts.forEach(product => {
          if (product !== thisProduct.element) {
            product.classList.remove('active');
          }
        });
        thisProduct.element.classList.toggle('active');
      });
    }

    initOrderForm() {
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });
    }

    processOrder() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);

      let price = thisProduct.data.price;

      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        for (let optionId in param.options) {
          const option = param.options[optionId];

          const optionImage = thisProduct.element.querySelector(`.${paramId}-${optionId}`);

          if (optionImage) {
            if (formData.hasOwnProperty(paramId) && formData[paramId].includes(optionId)) {
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            } else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }

          if (formData.hasOwnProperty(paramId) && formData[paramId].includes(optionId) && !option.default) {
            price += option.price;
          } else if (!formData.hasOwnProperty(paramId) || !formData[paramId].includes(optionId) && option.default) {
            price += option.price;
          }
        }
      }

      price *= thisProduct.amountWidget.value;
      thisProduct.priceElem.innerHTML = price;
    }

    getElements() {
      const thisProduct = this;
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelectorAll(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });
    }
  }

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.initActions();

      if (thisWidget.input.value !== '' && !isNaN(thisWidget.input.value)) {
        thisWidget.setValue(thisWidget.input.value);
      } else {
        thisWidget.setValue(settings.amountWidget.defaultValue);
      }
    }

    getElements(element) {
      const thisWidget = this;
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);


      thisWidget.value = parseInt(thisWidget.input.value) || settings.amountWidget.defaultValue;
    }

    setValue(value) {
      const thisWidget = this;

      if (isNaN(value)) {
        value = 1;
      } else {
        value = parseInt(value);
        if (value < settings.amountWidget.defaultMin) {
          value = settings.amountWidget.defaultMin;
        } else if (value > settings.amountWidget.defaultMax) {
          value = settings.amountWidget.defaultMax;
        }
      }

      thisWidget.value = value;
      thisWidget.input.value = thisWidget.value;

      if (!isNaN(value) && value >= settings.amountWidget.defaultMin && value <= settings.amountWidget.defaultMax) {
        thisWidget.announce();
      }
    }



    initActions() {
      const thisWidget = this;
    
      thisWidget.input.addEventListener('change', () => {
        const value = thisWidget.input.value !== '' ? thisWidget.input.value : settings.amountWidget.defaultValue;
        thisWidget.setValue(value);
      });
      thisWidget.linkDecrease.addEventListener('click', (event) => {
        event.preventDefault();
        const newValue = thisWidget.input.value !== '' ? thisWidget.input.value - 1 : settings.amountWidget.defaultValue - 1;
        thisWidget.setValue(newValue);
      });

      thisWidget.linkIncrease.addEventListener('click', (event) => {
        event.preventDefault();
        const newValue = thisWidget.input.value !== '' ? parseInt(thisWidget.input.value) + 1 : settings.amountWidget.defaultValue + 1;
        thisWidget.setValue(newValue);
      });
      
    }
    

    announce() {
      const thisWidget = this;
      const event = new Event('updated');
      thisWidget.element.dispatchEvent(event);
    }
  }


  class Cart {
    constructor(element){
      const thisCart = this;

      thisCart.product = [];

      thisCart.getElements(element);
      thisCart.initActions();

      console.log('new Cart', thisCart);
    }

    getElements(element){
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;

      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    }

    initActions() {
      const thisCart = this;
  
      thisCart.dom.toggleTrigger.addEventListener('click', function() {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
    }
  }



  const app = {
    initMenu: function () {
      const thisApp = this;
      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    
    },

    initData: function () {
      const thisApp = this;

      thisApp.data = dataSource;
    },

    init: function () {
      const thisApp = this;

      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();

    },
  };

  app.init();
}
