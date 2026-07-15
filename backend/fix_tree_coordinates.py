"""
One-off fix: trees were seeded with lat/lng jittered +/-0.02 deg (~2.2km box)
around their project's single center point. For coastal/mangrove projects
that box crosses the shoreline, so roughly half the "trees" ended up
plotted in open water on the GIS map. Re-jitters every existing tree's
coordinates using the smaller TREE_COORD_JITTER_DEG from seed.py instead.

This only touches synthetic demo coordinates (not real field GPS data),
same as the original seed. Run once against whichever DB needs fixing:
    DATABASE_URL=... python fix_tree_coordinates.py
"""
import random
from database import SessionLocal, Tree, Project
from seed import TREE_COORD_JITTER_DEG


def main():
    db = SessionLocal()
    try:
        projects = {p.id: p for p in db.query(Project).all()}
        updated = 0
        for tree in db.query(Tree).filter(Tree.project_id.isnot(None)).all():
            project = projects.get(tree.project_id)
            if not project or project.latitude is None or project.longitude is None:
                continue
            tree.latitude = project.latitude + random.uniform(-TREE_COORD_JITTER_DEG, TREE_COORD_JITTER_DEG)
            tree.longitude = project.longitude + random.uniform(-TREE_COORD_JITTER_DEG, TREE_COORD_JITTER_DEG)
            updated += 1
        db.commit()
        print(f"Re-jittered coordinates for {updated} trees.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
