export function createState() {
	return {
		items: [],
		excludedIndexes: [],
		talkedIndexes: [],
		rotation: 0,
		isSpinning: false,
		activeWinnerIndex: null,
		isWinnerHighlightVisible: true,
		lastPointerIndex: null,
		recentWinnerIndexes: []
	};
}
