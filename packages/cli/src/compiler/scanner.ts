import ts from "typescript";
import { MetadataRegistry } from "./registry";
import { DIScanner } from "./di/scanner";
import { ControllerScanner } from "./background/controller/scanner";
import { BackgroundScanner } from "./background/scanner";
import { WorkerScanner } from "./background/worker/scanner";
import { HandlerScanner } from "./content/handler/scanner";
import { ContentScanner } from "./content/scanner";
import { StoreScanner } from "./store/scanner";
import { ResolvedBuildConfig } from "../bin/config/resolve";
import { DtoScanner } from './dto/scanner';
import { ViewScanner } from './content/view/scanner';


export class Scanner {
    private diScanner: DIScanner;
    private backgroundScanner: BackgroundScanner;
    private workerScanner: WorkerScanner;
    private contentScanner: ContentScanner;
    private controllerScanner: ControllerScanner;
    private handlerScanner: HandlerScanner;
    private storeScanner: StoreScanner;
    private dtoScanner: DtoScanner;
    private viewScanner: ViewScanner;
    constructor(private program: ts.Program, private config: ResolvedBuildConfig) {
        this.diScanner = new DIScanner(program.getTypeChecker(), config.debug);
        this.backgroundScanner = new BackgroundScanner(program.getTypeChecker(), this.diScanner);
        this.workerScanner = new WorkerScanner(program.getTypeChecker(), this.diScanner);
        this.contentScanner = new ContentScanner(program.getTypeChecker(), this.diScanner);
        this.controllerScanner = new ControllerScanner(program.getTypeChecker(), this.diScanner);
        this.handlerScanner = new HandlerScanner(program.getTypeChecker(), this.diScanner);
        this.storeScanner = new StoreScanner(program.getTypeChecker(), this.diScanner);
        this.dtoScanner = new DtoScanner(program.getTypeChecker());
        this.viewScanner = new ViewScanner(program.getTypeChecker(), this.diScanner, process.cwd());
    }

    /**
     * Get package metadata loaded from HexaJS runtime packages.
     */
    public getPackageMetadata() {
        return this.diScanner.getPackageMetadata();
    }

    scan(program: ts.Program, registry: MetadataRegistry): void {
        for (const sourceFile of program.getSourceFiles()) {
            if (sourceFile.isDeclarationFile) continue;

            ts.forEachChild(sourceFile, (node: ts.Node) => {
                const diMetadata = this.diScanner.scan(node);
                if (diMetadata) registry.addService(diMetadata);

                // Scan for createToken() declarations
                const tokenMetadata = this.diScanner.scanToken(node);
                if (tokenMetadata) registry.addToken(tokenMetadata);

                const background = this.backgroundScanner.scan(node);
                if (background) registry.addBackgroundEntry(background);

                const worker = this.workerScanner.scan(node);
                if (worker) registry.addWorker(worker);

                const content = this.contentScanner.scan(node);
                if (content) registry.addContentEntry(content);

                const controller = this.controllerScanner.scan(node);
                if (controller) registry.addController(controller);

                const handler = this.handlerScanner.scan(node);
                if (handler) registry.addHandler(handler);

                const state = this.storeScanner.scan(node);
                if (state) registry.addState(state);

                const dtoValidation = this.dtoScanner.scan(node);
                if (dtoValidation) registry.addDtoValidation(dtoValidation);

                const view = this.viewScanner.scan(node);
                if (view) registry.addView(view);
            });
        }
    }
}