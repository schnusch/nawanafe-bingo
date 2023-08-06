import { items } from "./items.json"

type Pick = {
	item: number
	checked: boolean
	elem?: HTMLElement
}

function guess_rectangle_dimensions(n: number): [number, number] {
	if(n <= 0) {
		return [0, 0]
	}

	const prime_factors = []
	let p = 2
	while(p <= n) {
		if(n % p == 0) {
			n /= p
			prime_factors.unshift(p)
		} else {
			++p
		}
	}

	let x = 1, y = 1
	for(p of prime_factors) {
		if(x < y) {
			x *= p
		} else {
			y *= p
		}
	}

	return [x, y]
}

function generate_fragment(columns: number, rows: number) {
	const indexes = []
	for(let i = items.length; i-- > 0;) {
		indexes.push(i)
	}
	const picks = []
	for(let i = columns * rows; i-- > 0;) {
		const j = Math.floor(Math.random() * indexes.length)
		picks.push({
			item: indexes.splice(j, 1)[0],
			checked: false,
		})
	}
	location.hash = dump_fragment(picks)
}

function dump_fragment(picks: Pick[]): string {
	return "#" + picks.map(x => `${x.item}${x.checked ? "x" : ""}`).join(",")
}

function parse_fragment(fragment: string): Pick[]|null {
	try {
		return fragment.substr(1).split(",").map(x => {
			const m = x.match(/^(\d+)(x?)$/)
			if(!m) {
				throw new Error()
			}
			return {
				item: parseInt(m[1], 10),
				checked: m[2].length > 0,
			}
		})
	} catch(e) {
		return null
	}
}

function fragment_changed(_?: Event) {
	const picks = parse_fragment(location.hash)
	if(picks == null) {
		generate_fragment(5, 5)
	} else {
		update_bingo(picks)
	}
}

let bingo = <HTMLElement><unknown>null

function create_bingo_tile(picks: Pick[], i: number): HTMLElement {
	const pick = picks[i]
	const item = items[pick.item]

	const outer = document.createElement("div")
	const inner = document.createElement("div")
	const inner2 = document.createElement("div")
	inner2.appendChild(document.createTextNode(item))
	inner.appendChild(inner2)
	outer.appendChild(inner)

	outer.addEventListener("click", _ => {
		pick.checked = !pick.checked
		location.hash = dump_fragment(picks)
	})

	return outer
}

let old_picks: Pick[] = []

function equal_itemes(a: Pick[], b: Pick[]): boolean {
	const n = a.length
	if(n != b.length) {
		return false
	}
	for(let i = 0; i < n; i++) {
		if(a[i].item != b[i].item) {
			return false
		}
	}
	return true
}

function update_bingo(picks: Pick[]): void {
	if(!equal_itemes(picks, old_picks)) {
		const [columns, rows] = guess_rectangle_dimensions(picks.length)
		bingo.style.gridTemplateColumns = `repeat(${columns}, 1fr)`
		bingo.style.gridTemplateRows = `repeat(${rows}, 1fr)`

		bingo.innerHTML = ""
		for(let i = 0; i < picks.length; i++) {
			const tile = picks[i].elem = create_bingo_tile(picks, i)
			bingo.appendChild(tile)
		}

		old_picks = picks
	}

	for(let i = 0; i < picks.length; i++) {
		const elem = old_picks[i].elem
		if(elem) {
			if(picks[i].checked) {
				elem.classList.add("checked")
			} else {
				elem.classList.remove("checked")
			}
		}
	}
}

document.addEventListener("DOMContentLoaded", _ => {
	document.body.classList.replace("nojs", "js")

	bingo = <typeof bingo>document.getElementById("bingo")
	if(!bingo) {
		return
	}

	window.addEventListener("hashchange", fragment_changed)
	fragment_changed()
})
