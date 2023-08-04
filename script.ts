import { items } from "./items.json"

type ItemInfo = null | {
	meme?: {
		video?: string
		image?: string
	}
	link?: {
		text: string
		href: string
	}
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
	const fragment = []
	const indexes = []
	for(let i = items.length; i-- > 0;) {
		indexes.push(i)
	}
	console.log(indexes)
	for(let i = columns * rows; i-- > 0;) {
		const j = Math.floor(Math.random() * indexes.length)
		fragment.push(indexes.splice(j, 1)[0])
	}
	location.hash = "#" + fragment.join(",")
}

function parse_fragment(fragment: string): number[]|null {
	const m = fragment.match(/^#(\d+(,\d+)*)$/)
	if(!m) {
		return null
	}
	return m[1].split(",").map(x => parseInt(x, 10))
}

function fragment_changed(_?: Event) {
	const picked_indexes = parse_fragment(location.hash)
	if(picked_indexes == null) {
		generate_fragment(3, 3)
	} else {
		populate_bingo(picked_indexes)
	}
}

let bingo = <HTMLElement><unknown>null
let popup = <HTMLElement><unknown>null

function add_to_popup(info: ItemInfo): HTMLElement|null {
	if(!info) {
		return null
	}
	const elem = document.createElement("div")
	if(info.meme) {
		if(info.meme.video) {
			const video = elem
				.appendChild(document.createElement("p"))
				.appendChild(document.createElement("video"))
			video.autoplay = false
			video.controls = true
			video.loop = true
			video.muted = true
			video.preload = "auto"
			video.src = info.meme.video
		}
		if(info.meme.image) {
			const image = elem
				.appendChild(document.createElement("p"))
				.appendChild(document.createElement("img"))
			image.src = info.meme.image
		}
	}
	if(info.link) {
		const link = elem
			.appendChild(document.createElement("p"))
			.appendChild(document.createElement("a"))
		link.appendChild(document.createTextNode(info.link.text))
		link.href = info.link.href
	}

	if(elem.children) {
		elem.style.display = "none"
		popup.appendChild(elem)
		return elem
	} else {
		return null
	}
}

function show_popup(popup_content: HTMLElement|null) {
	for(const e of popup.children) {
		const style = (<HTMLElement>e).style
		const media = <HTMLMediaElement[]>Array.from(e.querySelectorAll("audio, video"))
		if(e == popup_content) {
			style.display = "block"
			media.forEach(m => m.play())
		} else {
			style.display = "none"
			media.forEach(m => m.pause())
		}
	}
	popup.style.display = popup_content == null ? "none" : "block"
}

function create_bingo_tile(item: string, info: ItemInfo): HTMLElement {
	const outer = document.createElement("div")
	const inner = document.createElement("div")
	inner.appendChild(document.createTextNode(item))
	outer.appendChild(inner)

	const popup_content = add_to_popup(info)
	if(popup_content) {
		outer.title = "click for stuff"
		outer.addEventListener("click", ev => {
			show_popup(popup_content)
			ev.stopPropagation()
		})
	}

	return outer
}

function populate_bingo(picked: number[]) {
	const [columns, rows] = guess_rectangle_dimensions(picked.length)

	bingo.style.gridTemplateColumns = `repeat(${columns}, 1fr)`
	bingo.style.gridTemplateRows = `repeat(${rows}, 1fr)`

	bingo.innerHTML = ""
	for(const i of picked) {
		const item = items[i]
		const caption = Object.keys(item)[0]
		const info = item[<keyof (typeof item)>caption]
		if(info === undefined) {
			// does never happen
		} else {
			const tile = create_bingo_tile(caption, info)
			bingo.appendChild(tile)
		}
	}
}

document.addEventListener("DOMContentLoaded", _ => {
	document.body.classList.replace("nojs", "js")

	bingo = <typeof bingo>document.getElementById("bingo")
	popup = <typeof popup>document.getElementById("popup")
	if(!bingo || !popup) {
		return
	}

	document.body.addEventListener("click", _ => {
		show_popup(null)
	})
	popup.addEventListener("click", ev => {
		ev.stopPropagation()
	})

	window.addEventListener("hashchange", fragment_changed)
	fragment_changed()
})
