const CATEGORY_COLORS = [
    "#2de1a3", "#ff6bcb", "#ffd166", "#6ec6ff", "#ff7f50",
    "#a385ff", "#ffb86b", "#43e97b", "#f6416c", "#f6416c"
  ];
  
  const categoryColorMap = new Map();
  let nextColorIndex = 0;
  
  const getColorForCategory = (category) => {
    if (!categoryColorMap.has(category)) {
      const color = CATEGORY_COLORS[nextColorIndex % CATEGORY_COLORS.length];
      categoryColorMap.set(category, color);
      nextColorIndex++;
    }
    return categoryColorMap.get(category);
  };
  
  export { CATEGORY_COLORS, getColorForCategory };
  