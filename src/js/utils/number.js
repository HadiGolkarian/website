const mathRandom = (num = 8) => {
  const numValue = - Math.random() * num + Math.random() * num;
  return numValue;
};

export {
  mathRandom
}