import { mathRandom } from './number';
import buildingSpecs from './generatedSpecs.json';

const buildingsSpec = [];
const cityLength = 8;
const cubeWidth = 0.9;
const downTown = 7;
const maxHeight = 6;
const minHeight = 0.1;

const generateBuildings = () => {
  for (let x = -cityLength; x <= cityLength; x++) {
    for (let z = -cityLength; z <= cityLength; z++) {

      // to skip some locations
      if ((x <= -downTown || x >= downTown) && (z <= -downTown || z >= downTown)) {
        if (Math.random() < 0.99) {
          continue;
        }
      } else if (Math.random() < 0.5) {
        continue;
      }

      buildingsSpec.push({
        position: { x, z },
        transform: {
          scale: {
            y: minHeight + Math.abs(mathRandom(6)),
          },
          delay: Math.round(Math.random() * 10) * 0.01
        },
        scale: {
          x: cubeWidth + mathRandom(1 - cubeWidth),
          z: cubeWidth + mathRandom(1 - cubeWidth),
          y: minHeight + Math.abs(mathRandom(maxHeight)),
        }
      });
    }
  }

  console.log(buildingsSpec);
};

// generateBuildings();
// export default buildingsSpec;

export default buildingSpecs;