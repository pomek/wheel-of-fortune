export function createState() {
	return {
		items: [],
		excludedIndexes: [],
		rotation: 0,
		isSpinning: false,
		activeWinnerIndex: null,
		isWinnerHighlightVisible: true,
		lastPointerIndex: null,
		recentWinnerIndexes: []
	};
}
