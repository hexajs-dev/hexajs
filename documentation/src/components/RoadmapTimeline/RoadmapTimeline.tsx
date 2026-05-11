import { PanelsTopLeft, Paintbrush2, Rocket, type LucideIcon } from 'lucide-react';
import './RoadmapTimeline.scss';

type RoadmapItem = {
    kicker: string;
    title: string;
    description: string;
    Icon: LucideIcon;
    done?: boolean;
};

const ITEMS: RoadmapItem[] = [
    {
        kicker: 'Surfaces',
        title: 'Managed New Tab',
        description: 'Extend the managed UI model beyond popup and devtools into a new tab surface, while keeping the same DI, messaging, and build conventions.',
        Icon: PanelsTopLeft,
        done: false,
    },
    {
        kicker: 'Managed UI',
        title: 'Vue.js Support',
        description: 'Bring Vue.js into the managed UI pipeline so teams can build extension surfaces with the same DI, messaging, and build ergonomics already used by popup and devtools.',
        Icon: Paintbrush2,
        done: false,
    },
    {
        kicker: 'Delivery',
        title: 'CLI Publish & Deploy',
        description: 'Add support for packaging and pushing builds to target platforms from the CLI, so release flows stay close to the project configuration and remain repeatable.',
        Icon: Rocket,
        done: false,
    },
];

export function RoadmapTimeline() {
    return (
        <div className="rmtTimeline">
            <div className="rmtLine" aria-hidden="true" />

            {ITEMS.map((item, index) => {
                const isLeft = index % 2 === 0;
                const { Icon, kicker, title, description, done } = item;

                const card = (
                    <div className={`rmtCard${done ? ' rmtCardDone' : ''}`}>
                        <div className="rmtCardHeader">
                            <div className={`rmtIconBox${done ? ' rmtIconBoxDone' : ''}`} aria-hidden="true">
                                <Icon size={15} strokeWidth={2} />
                            </div>
                            <span className="rmtKicker">{kicker}</span>
                        </div>
                        <p className="rmtTitle">{title}</p>
                        <p className="rmtDescription">{description}</p>
                    </div>
                );

                return (
                    <div key={title} className="rmtRow">
                        {isLeft ? (
                            <div className="rmtSide rmtSideLeft">{card}</div>
                        ) : (
                            <div className="rmtSideEmpty" />
                        )}
                        <div className='rmDotContainer'>
                            <div className={`rmtDot${done ? ' rmtDotDone' : ''}`} aria-hidden="true" />
                        </div>

                        {!isLeft ? (
                            <div className="rmtSide rmtSideRight">{card}</div>
                        ) : (
                            <div className="rmtSideEmpty" />
                        )}
                    </div>
                );
            })}

            <p className="rmtNote">
                These are capability goals, not promises about timing. The order may change as the platform evolves.
            </p>
        </div>
    );
}
