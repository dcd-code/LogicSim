// Declare global variables for components, wires, and UI elements
let agb, nandb, norb, notb, xorb, xnorb, orb, ofsb, onb, ofbb, clearButton, deleteButton, reevaluateButton;
let yOffset;
let components = []; 
let selectedComponent = null; 
let selectedWire = null; 
let binX, binY, binWidth, binHeight; 

let firstNode = null; 
let wires = []; 
let connections = []; 

// Define the Component class
class Component {
  constructor(img, x, y, width, height, type) {
    this.img = img; 
    this.x = x; 
    this.y = y; 
    this.width = width; 
    this.height = height; 
    this.type = type;
    this.dragging = false; 
    this.offsetX = 0; 
    this.offsetY = 0; 
    this.isOn = false; 
    this.nodes = []; 
    this.addNodes(); 
    this.updateNodes(); 

    if (type === 'offBulb') {
      this.onBulbImg = loadImage('/img/onBulb.png'); 
      this.offBulbImg = img; 
    } else if (type === 'offState' || type === 'onState') {
      this.onStateImg = loadImage('/img/onState.png'); 
    }

    if (type === 'onState') {
      console.log('onState component created'); 
    } else if (type === 'offState') {
      console.log(0); 
    }
  }

  addNodes() {
    switch (this.type) {
      case 'andGate':
      case 'nandGate':
      case 'norGate':
      case 'xorGate':
      case 'xnorGate':
      case 'orGate':
        this.nodes.push({ offsetX: 10, offsetY: 20, type: 'input', connected: false, value: 'NA' });
        this.nodes.push({ offsetX: 10, offsetY: 64, type: 'input', connected: false, value: 'NA' });
        this.nodes.push({ offsetX: this.width - 10, offsetY: 42, type: 'output', value: 'NA' });
        break;
      case 'notGate':
        this.nodes.push({ offsetX: 10, offsetY: 42, type: 'input', connected: false, value: 'NA' });
        this.nodes.push({ offsetX: this.width - 10, offsetY: 42, type: 'output', value: 'NA' });
        break;
      case 'offState':
      case 'onState':
        this.nodes.push({ offsetX: 73, offsetY: 37.5, type: 'output', value: 0 });
        break;
      case 'offBulb':
        this.nodes.push({ offsetX: 37, offsetY: 75, type: 'input', connected: false, value: 0 });
        break;
      default:
        break;
    }
  }

  updateNodes() {
    for (let node of this.nodes) {
      node.x = this.x + node.offsetX; 
      node.y = this.y + node.offsetY; 
    }
  }

  display() {
    if (this.type === 'onBulb') {
      image(this.onBulbImg, this.x, this.y, this.width, this.height); 
    } else if (this.type === 'offState' && this.isOn) {
      image(this.onStateImg, this.x, this.y, this.width, this.height); 
    } else {
      image(this.img, this.x, this.y, this.width, this.height); 
    }
    if (this === selectedComponent) {
      push();
      stroke("red");
      strokeWeight(2);
      noFill();
      rect(this.x, this.y, this.width, this.height); // Highlight selected component
      pop();
    }
    for (let node of this.nodes) {
      push();
      stroke("black");
      strokeWeight(3);
      fill(node.type === 'input' ? "lime" : "cyan");
      ellipse(node.x, node.y, 10, 10); 

      // Display node value
      fill(0);
      textSize(12);
      textAlign(CENTER, CENTER);
      
      if (node.connected || node.value !== 'NA') {
        text(node.value, node.x, node.y - 15);
      } else {
        text('NA', node.x, node.y - 15);
      }

      if (firstNode && firstNode.component === this && firstNode.node === node) {
        stroke("yellow");
        strokeWeight(2);
        noFill();
        ellipse(node.x, node.y, 14, 14); 
      }
      pop();
    }
  }

  mousePressed() {
    if (mouseX > this.x && mouseX < this.x + this.width &&
      mouseY > this.y && mouseY < this.y + this.height) {
      this.dragging = true; 
      this.offsetX = this.x - mouseX; 
      this.offsetY = this.y - mouseY; 
      selectedComponent = this; 
      selectedWire = null; 
    }

    for (let node of this.nodes) {
      if (dist(mouseX, mouseY, node.x, node.y) < 10) {
        if (firstNode === null) {
          firstNode = { component: this, node: node }; // Set first node for wire creation
          console.log(`First node selected: ${firstNode.component.type}, ${firstNode.node.type}`);
        } else {
          if (firstNode.component !== this && !node.connected) {
            // Ensure connection is output to input
            let outputNode, inputNode, fromComponent, toComponent;

            if (firstNode.node.type === 'output' && node.type === 'input') {
              
              outputNode = firstNode.node;
              inputNode = node;
              fromComponent = firstNode.component;
              toComponent = this;
            } else if (firstNode.node.type === 'input' && node.type === 'output') {
              
              outputNode = node;
              inputNode = firstNode.node;
              fromComponent = this;
              toComponent = firstNode.component;
            } else {
              // Invalid connection, reset firstNode
              firstNode = null;
              return;
            }

            if (!inputNode.connected) {
              wires.push({ node1: outputNode, node2: inputNode, component1: fromComponent, component2: toComponent }); // Create wire
              console.log(`Wire created between ${fromComponent.type} (output) and ${toComponent.type} (input)`);
              connections.push({ from: fromComponent.type, fromNode: outputNode.type, to: toComponent.type, toNode: inputNode.type });
              inputNode.connected = true; 
              outputNode.connected = true; 
              updateCircuit(); 
              logConnections(); 
            }
          }
          firstNode = null; // Reset first node
        }
        break;
      }
    }
  }

  mouseDragged() {
    if (this.dragging) {
      let newX = mouseX + this.offsetX;
      let newY = mouseY + this.offsetY;
      this.x = constrain(newX, 0, width - this.width); 
      this.y = constrain(newY, 0, yOffset - 10 - this.height); 
      this.updateNodes(); 
    }
  }

  mouseReleased() {
    this.dragging = false; 
  }

  evaluate() {
    // Handle the evaluation of NOT gate, setting to NA if unconnected
    if (this.type === 'notGate') {
      const inputNode = this.nodes[0];
      const outputNode = this.nodes[1];
      if (!inputNode.connected) {
        outputNode.value = 'NA'; 
      } else {
        outputNode.value = inputNode.value === 1 ? 0 : 1; 
      }
      return;
    }

    // Unconnected = NA
    for (let node of this.nodes) {
      if (node.type === 'input' && !node.connected) {
        node.value = 'NA';
      }
    }

    switch (this.type) {
      case 'andGate':
        if (this.nodes[0].value !== 'NA' && this.nodes[1].value !== 'NA') {
          this.nodes[2].value = this.nodes[0].value & this.nodes[1].value; 
        } else {
          this.nodes[2].value = 'NA'; 
        }
        break;
      case 'nandGate':
        if (this.nodes[0].value !== 'NA' && this.nodes[1].value !== 'NA') {
          this.nodes[2].value = Number(!(this.nodes[0].value & this.nodes[1].value)); 
        } else {
          this.nodes[2].value = 'NA'; 
        }
        break;
      case 'norGate':
        if (this.nodes[0].value !== 'NA' && this.nodes[1].value !== 'NA') {
          this.nodes[2].value = Number(!(this.nodes[0].value | this.nodes[1].value));
        } else {
          this.nodes[2].value = 'NA';
        }
        break;
      case 'xorGate':
        if (this.nodes[0].value !== 'NA' && this.nodes[1].value !== 'NA') {
          this.nodes[2].value = this.nodes[0].value ^ this.nodes[1].value; 
        } else {
          this.nodes[2].value = 'NA'; 
        }
        break;
      case 'xnorGate':
        if (this.nodes[0].value !== 'NA' && this.nodes[1].value !== 'NA') {
          this.nodes[2].value = Number(!(this.nodes[0].value ^ this.nodes[1].value)); 
        } else {
          this.nodes[2].value = 'NA'; 
        }
        break;
      case 'orGate':
        if (this.nodes[0].value !== 'NA' && this.nodes[1].value !== 'NA') {
          this.nodes[2].value = this.nodes[0].value | this.nodes[1].value; 
        } else {
          this.nodes[2].value = 'NA'; 
        }
        break;
      case 'offState':
        this.nodes[0].value = 0; 
        break;
      case 'onState':
        this.nodes[0].value = 1; 
        break;
      case 'offBulb':
        this.checkBulbState(); 
        break;
      default:
        break;
    }
  }

  //Check the state of the connected component's output
  checkBulbState() {
    
    let bulbOn = false;
    for (let wire of wires) {
      if (wire.node2 === this.nodes[0] && wire.node2.type === 'input') {
        let connectedComponent = wire.component1;
        let outputNode = connectedComponent.nodes.find(node => node.type === 'output');
        if (outputNode && outputNode.value === 1) {
          bulbOn = true; 
          break;
        }
      } else if (wire.node1 === this.nodes[0] && wire.node1.type === 'input') {
        let connectedComponent = wire.component2;
        let outputNode = connectedComponent.nodes.find(node => node.type === 'output');
        if (outputNode && outputNode.value === 1) {
          bulbOn = true; 
          break;
        }
      }
    }

    if (bulbOn) {
      this.type = 'onBulb';
      this.img = this.onBulbImg;
      this.nodes[0].value = 1;
    } else {
      this.type = 'offBulb';
      this.img = this.offBulbImg; 
      this.nodes[0].value = 0;
    }
  }
}

// Preload images for components
function preload() {
  andGateImg = loadImage('/img/andGate.png');
  nandGateImg = loadImage('/img/nandGate.png');
  norGateImg = loadImage('/img/norGate.png');
  notGateImg = loadImage('/img/notGate.png');
  xorGateImg = loadImage('/img/xorGate.png');
  xnorGateImg = loadImage('/img/xnorGate.png');
  orGateImg = loadImage('/img/orGate.png');
  offStateImg = loadImage('/img/offState.png');
  offBulbImg = loadImage('/img/offBulb.png');
  onBulbImg = loadImage('/img/onBulb.png');
  onStateImg = loadImage('/img/onState.png');
}

// Setup the canvas and initialize components
function setup() {
  createCanvas(windowWidth - 50, windowHeight - 20);
  background("gray");

  yOffset = windowHeight - 105; 

  andgate();
  nandgate();
  norgate();
  notgate();
  xorgate();
  xnorgate();
  orgate();
  offState();
  onState();
  offBulb();
  clearCanvas();
  deleteComponentButton();
  createReevaluateButton(); 



}

// Main draw loop
function draw() {
  background("gray"); 
  bnames(); 

  textSize(32)
  text("LOGIC SIM", (windowWidth - 50) / 2, 15)

  image(onStateImg, 1665, yOffset + 5, 75, 75)


  for (let component of components) {
    component.display(); 
  }

  for (let wire of wires) {
    push();
    stroke(wire === selectedWire ? "red" : "black");
    strokeWeight(wire === selectedWire ? 5 : 2);
    line(wire.node1.x, wire.node1.y, wire.node2.x, wire.node2.y); 
    pop();
  }

  updateCircuit(); 
}

// Update the circuit logic
function updateCircuit() {
  for (let component of components) {
    component.evaluate();
  }

  // Unconnected = NA
  for (let component of components) {
    for (let node of component.nodes) {
      if (node.type === 'input' && !node.connected) {
        node.value = 'NA'; 
      }
    }
  }

  // Propagate the values through the wires(output to input node)
  for (let wire of wires) {
    if (wire.node1 && wire.node2 && wire.node1.type === 'output' && wire.node2.type === 'input') {
      wire.node2.value = wire.node1.value; 
    }
  }

  
  for (let component of components) {
    if (component.type === 'offBulb' || component.type === 'onBulb') {
      component.checkBulbState(); 
    }
  }
}

// Log all connections
function logConnections() {
  console.log("Connections:");
  connections.forEach((connection, index) => {
    console.log(`Connection ${index + 1}:`);
    console.log(`  From: ${connection.from} (${connection.fromNode})`);
    console.log(`  To: ${connection.to} (${connection.toNode})`);
  });
}

// Handle mouse press events
function mousePressed() {
  let wireClicked = false;

  for (let wire of wires) {
    let d = dist(mouseX, mouseY, (wire.node1.x + wire.node2.x) / 2, (wire.node1.y + wire.node2.y) / 2);
    if (d < 25) {
      selectedWire = wire; 
      selectedComponent = null; 
      wireClicked = true;
      break;
    }
  }

  if (!wireClicked) {
    selectedWire = null;
    for (let component of components) {
      component.mousePressed(); 
    }
  }
}

// Handle mouse drag events
function mouseDragged() {
  for (let component of components) {
    component.mouseDragged(); 
  }
}

// Handle mouse release events
function mouseReleased() {
  for (let component of components) {
    component.mouseReleased(); 
  }
}

// Create AND gate button and functionality
function andgate() {
  andGate = createImg('/img/andGate.png');
  andGate.position(10, yOffset + 10);

  agb = createButton('');
  agb.position(0, yOffset);
  agb.size(200, 84);
  agb.style('border-width', '4px');
  agb.style('border-color', 'black');
  agb.style('background', 'transparent');

  agb.mousePressed(() => {
    let newComponent = new Component(andGateImg, mouseX, mouseY - 200, 200, 84, 'andGate');
    components.push(newComponent); 
    updateCircuit(); 
    logConnections(); 
  });
}

// Create NAND gate button and functionality
function nandgate() {
  nandGate = createImg('/img/nandGate.png');
  nandGate.position(211, yOffset + 10);

  nandb = createButton('');
  nandb.position(201, yOffset);
  nandb.size(200, 84);
  nandb.style('border-width', '4px');
  nandb.style('border-color', 'black');
  nandb.style('background', 'transparent');

  nandb.mousePressed(() => {
    let newComponent = new Component(nandGateImg, mouseX, mouseY - 200, 200, 84, 'nandGate');
    components.push(newComponent); 
    updateCircuit(); 
    logConnections(); 
  });
}

// Create NOR gate button and functionality
function norgate() {
  norGate = createImg('/img/norGate.png');
  norGate.position(419, yOffset + 10);

  norb = createButton('');
  norb.position(402, yOffset);
  norb.size(200, 84);
  norb.style('border-width', '4px');
  norb.style('border-color', 'black');
  norb.style('background', 'transparent');

  norb.mousePressed(() => {
    let newComponent = new Component(norGateImg, mouseX, mouseY - 200, 200, 84, 'norGate');
    components.push(newComponent); 
    updateCircuit(); 
    logConnections(); 
  });
}

// Create NOT gate button and functionality
function notgate() {
  notGate = createImg('/img/notGate.png');
  notGate.position(619, yOffset + 10);

  notb = createButton('');
  notb.position(604, yOffset);
  notb.size(200, 84);
  notb.style('border-width', '4px');
  notb.style('border-color', 'black');
  notb.style('background', 'transparent');

  notb.mousePressed(() => {
    let newComponent = new Component(notGateImg, mouseX, mouseY - 200, 200, 84, 'notGate');
    components.push(newComponent); 
    updateCircuit(); 
    logConnections(); 
  });
}

// Create XOR gate button and functionality
function xorgate() {
  xorGate = createImg('/img/xorGate.png');
  xorGate.position(819, yOffset + 10);

  xorb = createButton('');
  xorb.position(804, yOffset);
  xorb.size(200, 84);
  xorb.style('border-width', '4px');
  xorb.style('border-color', 'black');
  xorb.style('background', 'transparent');

  xorb.mousePressed(() => {
    let newComponent = new Component(xorGateImg, mouseX, mouseY - 200, 200, 84, 'xorGate');
    components.push(newComponent); 
    updateCircuit(); 
    logConnections(); 
  });
}

// Create XNOR gate button and functionality
function xnorgate() {
  xnorGate = createImg('/img/xnorGate.png');
  xnorGate.position(1019, yOffset + 10);

  xnorb = createButton('');
  xnorb.position(1005, yOffset);
  xnorb.size(200, 84);
  xnorb.style('border-width', '4px');
  xnorb.style('border-color', 'black');
  xnorb.style('background', 'transparent');

  xnorb.mousePressed(() => {
    let newComponent = new Component(xnorGateImg, mouseX, mouseY - 200, 200, 84, 'xnorGate');
    components.push(newComponent); 
    updateCircuit(); 
    logConnections(); 
  });
}

// Create OR gate button and functionality
function orgate() {
  orGate = createImg('/img/orGate.png');
  orGate.position(1229, yOffset + 7);

  orb = createButton('');
  orb.position(1206, yOffset);
  orb.size(200, 84);
  orb.style('border-width', '4px');
  orb.style('border-color', 'black');
  orb.style('background', 'transparent');

  orb.mousePressed(() => {
    let newComponent = new Component(orGateImg, mouseX, mouseY - 200, 200, 84, 'orGate');
    components.push(newComponent); 
    updateCircuit(); 
    logConnections(); 
  });
}

// Create offState button and functionality
function offState() {
  offState = createImg('/img/offState.png');
  offState.position(1465, yOffset + 4.1);
  offState.size(75, 75);

  ofsb = createButton('');
  ofsb.position(1407, yOffset);
  ofsb.size(200, 84);
  ofsb.style('border-width', '4px');
  ofsb.style('border-color', 'black');
  ofsb.style('background', 'transparent');

  ofsb.mousePressed(() => {
    let newComponent = new Component(offStateImg, mouseX, mouseY - 200, 75, 75, 'offState');
    components.push(newComponent); 
    updateCircuit(); 
    logConnections(); 
  });
}

// Create onState button and functionality
function onState() {
  onb = createButton('');
  onb.position(1607, yOffset);
  onb.size(200, 84);
  onb.style('border-width', '4px');
  onb.style('border-color', 'black');
  onb.style('background', 'transparent');

  onb.mousePressed(() => {
    let newComponent = new Component(onStateImg, mouseX, mouseY - 200, 75, 75, 'onState');
    components.push(newComponent); 
    console.log('onState component created');
    updateCircuit(); 
    logConnections(); 
  });
}

// Create offBulb button and functionality
function offBulb() {
  offBulb = createImg('/img/offBulb.png');
  offBulb.position(1865, yOffset + 5);
  offBulb.size(75, 85);

  ofbb = createButton('');
  ofbb.position(1808, yOffset);
  ofbb.size(200, 84);
  ofbb.style('border-width', '4px');
  ofbb.style('border-color', 'black');
  ofbb.style('background', 'transparent');

  ofbb.mousePressed(() => {
    let newComponent = new Component(offBulbImg, mouseX, mouseY - 200, 75, 85, 'offBulb');
    components.push(newComponent); 
    updateCircuit(); 
    logConnections(); 
  });
}

// Create clear canvas button and functionality
function clearCanvas() {
  clearButton = createButton('CLEAR CANVAS');
  clearButton.position(1880, 0);
  clearButton.size(120, 30);
  clearButton.style('border-width', '3px');
  clearButton.style('border-color', 'black');
  clearButton.style('background', 'transparent');

  clearButton.mousePressed(() => {
    components = []; 
    selectedComponent = null; 
    selectedWire = null; 
    wires = []; 
    firstNode = null; 
    connections = []; 
    updateCircuit(); 
    logConnections(); 
  });
}

// Create delete component button and functionality
function deleteComponentButton() {
  deleteButton = createButton('DELETE COMPONENT');
  deleteButton.position(1880, 40);
  deleteButton.size(120, 30);
  deleteButton.style('border-width', '3px');
  deleteButton.style('border-color', 'black');
  deleteButton.style('background', 'transparent');

  deleteButton.mousePressed(() => {
    if (selectedComponent) {
      
      wires = wires.filter(wire => {
        if (wire.component1 === selectedComponent || wire.component2 === selectedComponent) {
          if (wire.node1 && wire.node1.type === 'input') {
            wire.node1.connected = false; 
          }
          if (wire.node2 && wire.node2.type === 'input') {
            wire.node2.connected = false; 
          }
          return false;
        }
        return true;
      });

      // Remove selected component
      components = components.filter(component => component !== selectedComponent);
      selectedComponent = null; 
      firstNode = null; 
    } else if (selectedWire) {
      selectedWire.node1.connected = false; 
      selectedWire.node2.connected = false; 
      wires = wires.filter(wire => wire !== selectedWire); 
      selectedWire = null; 
    }
    updateCircuit(); 
    logConnections(); 
  });
}

// Create reevaluate button and functionality
function createReevaluateButton() {
  reevaluateButton = createButton('REEVALUATE');
  reevaluateButton.position(1880, 80);
  reevaluateButton.size(120, 30);
  reevaluateButton.style('border-width', '3px');
  reevaluateButton.style('border-color', 'black');
  reevaluateButton.style('background', 'transparent');

  reevaluateButton.mousePressed(() => {
    updateCircuit(); 
  });
}

// Display button names
function bnames() {
  textSize(20);
  fill(0);
  textAlign(CENTER, CENTER);
  const buttonNames = [
    'AND Gate', 'NAND Gate', 'NOR Gate', 'NOT Gate', 'XOR Gate',
    'XNOR Gate', 'OR Gate', 'Low Constant', 'High Constant', 'Off Bulb', 'Bin'
  ];
  buttonNames.forEach((name, index) => {
    text(name, 100 + index * 200, yOffset - 5); 
  });
}
