export function createState() {
	return {
		items: [],
		rotation: 0,
		isSpinning: false,
		activeWinnerIndex: null,
		isWinnerHighlightVisible: true,
		lastPointerIndex: null,
		recentWinnerIndexes: []
	};
}
