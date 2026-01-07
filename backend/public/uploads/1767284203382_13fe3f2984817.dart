import 'package:cs_310_project/models/item_model.dart';

class MockItems {
  static final List<ClosetItemModel> list = [
    ClosetItemModel(
      name: "Black T-Shirt",
      category: "Top",
      style: "Casual",
      season: "Summer",
      color: "Black",
      imagePath: "lib/core/mock/mock_images/black_tshirt.jpg",
    ),
    ClosetItemModel(
      name: "Blue T-Shirt",
      category: "Top",
      style: "Casual",
      season: "Summer",
      color: "Blue",
      imagePath: "lib/core/mock/mock_images/blue_tshirt.jpg",
    ),
    ClosetItemModel(
      name: "Black Jeans",
      category: "Bottom",
      style: "Classic",
      season: "All",
      color: "Black",
      imagePath: "lib/core/mock/mock_images/black_jean.jpg",
    ),
    ClosetItemModel(
      name: "Blue Jeans",
      category: "Bottom",
      style: "Classic",
      season: "All",
      color: "Blue",
      imagePath: "lib/core/mock/mock_images/blue_jean.jpg",
    ),
  ];
}
