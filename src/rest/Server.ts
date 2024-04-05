import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import {InsightDatasetKind, NotFoundError} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";
import {nextTick} from "process";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	public static facade: InsightFacade;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();
		Server.facade = new InsightFacade();

		this.registerMiddleware();
		this.registerRoutes();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		this.express.use(express.static("./frontend/public"));
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express.listen(this.port, () => {
					console.info(`Server::start() - server listening on port: ${this.port}`);
					resolve();
				}).on("error", (err: Error) => {
					// catches errors in server start
					console.error(`Server::start() - server ERROR: ${err.message}`);
					reject(err);
				});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);

		// TODO: your other endpoints should go here
		// PUT request
		this.express.put("/dataset/:id/:kind", Server.addDatasets);
		// (req, res) =>{
		// 	console.info("PUT request hit");

		// 	const id = req.params.id;
		// 	let kind: InsightDatasetKind;
		// 	if (req.params.kind === "sections") {
		// 		kind = InsightDatasetKind.Sections;
		// 	} else {
		// 		kind = InsightDatasetKind.Rooms;
		// 	}
		// 	const content = req.body.toString("base64");

		// 	Server.facade.addDataset(id, content, kind)
		// 		.then((result) => {
		// 			res.status(200);
		// 			res.send({result : result});
		// 		}).catch((err) => {
		// 			console.log(err);
		// 			res.status(400);
		// 			res.send({error: err});
		// 		});
		// });

		// DELETE request
		this.express.delete("/dataset/:id", Server.deleteDatasets);

		// POST /query sends json query to performQuery
		this.express.post("/query", Server.performQuery); // http://localhost:4321/query

		// GET /datasets returns a list of all datasets
		this.express.get("/datasets", Server.listDatasets); // http://localhost:4321/datasets

		// additional endpoints for frontend
		this.express.get("/buildings", Server.getBuildings);
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	// GET /buildings returns a list of all buildings for each dataset
	private static async getBuildings(req: Request, res: Response) {
		console.log("Server::getBuildings(..) request hit");
		try {
			const response = await Server.facade.getBuildings();
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: `error in getBuildings response: ${err}`});
		}
	}

	// POST /query sends json query to performQuery
	private static async performQuery(req: Request, res: Response) {
		console.log(`Server::query(..) request hit - body: ${JSON.stringify(req.body)}`);
		try {
			const query = JSON.parse(JSON.stringify(req.body));
			const response = await Server.facade.performQuery(query);
			res.status(200).json({result: response});
		} catch (err) {
			console.log(err);
			res.status(400).json({error: `error in performQuery response: ${err}`});
		}
	}

	// GET /datasets returns a list of all datasets
	private static async listDatasets(req: Request, res: Response) {
		console.log("Server::datasets(..)} request hit");
		try {
			const response = await Server.facade.listDatasets();
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: `error in listDatasets response: ${err}`});
		}
	}

	private static async addDatasets(req: Request, res: Response) {
		try {
			console.info("PUT request hit");

			const id = req.params.id;
			let kind: InsightDatasetKind;
			if (req.params.kind === "sections") {
				kind = InsightDatasetKind.Sections;
			} else if (req.params.kind === "rooms") {
				kind = InsightDatasetKind.Rooms;
			} else {
				res.status(400).json({error: "Invalid type"});
				return;
			}
			let content = req.body.toString("base64");

			const response = await Server.facade.addDataset(id, content, kind);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: `${err}`});
		}
	}

	private static async deleteDatasets(req: Request, res: Response) {
		try {
			console.info("DELETE request hit");
			const id = req.params.id;

			const response = await Server.facade.removeDataset(id);
			res.status(200).json({result: response});
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(404).json({error: `${err}`});
			} else {
				res.status(400).json({error: `${err}`});
			}
		}
	}
}
